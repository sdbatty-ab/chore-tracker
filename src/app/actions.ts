"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getFamily() {
  const { data, error } = await supabase.from("families").select("*").order("created_at", { ascending: true }).limit(1).single();
  if (error || !data) {
    // If no family exists, create a default one
    const { data: newFamily, error: insertError } = await supabase
      .from("families")
      .insert({ name: "Our Family" })
      .select()
      .single();
    if (insertError) {
      console.error("Error creating family:", insertError);
      return null;
    }
    return newFamily;
  }
  return data;
}

export async function getChores() {
  const family = await getFamily();
  if (!family) return [];

  // --- Auto-Reset Daily & Weekly Chores Logic ---
  const today = new Date();
  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
  const todayDate = localToday.toISOString().split('T')[0];
  
  // Calculate the most recent Sunday
  const dayOfWeek = localToday.getDay(); // 0 is Sunday
  const lastSunday = new Date(localToday);
  lastSunday.setDate(localToday.getDate() - dayOfWeek);
  const weekStartDate = lastSunday.toISOString().split('T')[0];
  
  const needsDailyReset = family.last_daily_reset !== todayDate;
  const needsWeeklyReset = family.last_weekly_reset !== weekStartDate;
  
  if (needsDailyReset || needsWeeklyReset) {
    if (needsDailyReset) {
      // Also catch any legacy is_daily chores
      await supabase.from("chores").update({ status: "pending" }).eq("family_id", family.id).or("recurrence.eq.daily,is_daily.eq.true");
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
        await supabase.from("chores").update({ status: "pending" }).eq("family_id", family.id).eq("recurrence", "weekdays");
      }
    }
    if (needsWeeklyReset) {
      await supabase.from("chores").update({ status: "pending" }).eq("family_id", family.id).eq("recurrence", "weekly");
    }
    
    await supabase.from("families").update({
      last_daily_reset: todayDate,
      last_weekly_reset: weekStartDate
    }).eq("id", family.id);
  }
  // -------------------------------------

  const { data, error } = await supabase
    .from("chores")
    .select(`
      *,
      profiles!chores_assigned_to_fkey (
        name,
        avatar_url
      )
    `)
    .eq("family_id", family.id)
    .order("created_at", { ascending: false });

  // If the explicit fkey fails (might not be named chores_assigned_to_fkey), we can try fallback
  if (error && error.message.includes("relationship")) {
    const fallback = await supabase
      .from("chores")
      .select("*, profiles!assigned_to(name, avatar_url)")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });
    
    if (fallback.error) {
      console.error("Error fetching chores with fallback:", fallback.error);
      return [];
    }
    return fallback.data;
  }

  if (error) {
    console.error("Error fetching chores:", error);
    return [];
  }
  return data;
}

export async function toggleChoreStatus(id: string, currentStatus: string) {
  // Fetch family settings to see if approval is required
  const family = await getFamily();
  const requireApproval = family?.require_approval ?? false;
  
  // Fetch the chore to get its points and assignment
  const { data: chore } = await supabase.from("chores").select("*").eq("id", id).single();
  if (!chore) throw new Error("Chore not found");

  let newStatus = currentStatus;
  
  if (currentStatus === "pending") {
    // If we are completing it:
    if (requireApproval) {
      newStatus = "completed"; // Wait for parent to approve
    } else {
      newStatus = "approved"; // Auto-approve
      // Grant points if assigned
      if (chore.assigned_to) {
        await grantPoints(chore.assigned_to, chore.points);
      }
    }
  } else if (currentStatus === "completed" || currentStatus === "approved") {
    // Undo completion
    newStatus = "pending";
    // If it was already approved, we need to deduct the points
    if (currentStatus === "approved" && chore.assigned_to) {
      await deductPoints(chore.assigned_to, chore.points);
    }
  }

  const { error } = await supabase
    .from("chores")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw new Error("Failed to update chore");

  revalidatePath("/");
  revalidatePath("/chores");
}

export async function completeUnassignedChore(id: string, profileId: string) {
  const family = await getFamily();
  const requireApproval = family?.require_approval ?? false;
  
  const { data: chore } = await supabase.from("chores").select("*").eq("id", id).single();
  if (!chore) throw new Error("Chore not found");
  
  if (chore.assigned_to) throw new Error("Chore is already assigned");
  
  let newStatus = "completed";
  if (!requireApproval) {
    newStatus = "approved";
    await grantPoints(profileId, chore.points);
  }
  
  const { error } = await supabase
    .from("chores")
    .update({ status: newStatus, assigned_to: profileId })
    .eq("id", id);
    
  if (error) throw new Error("Failed to complete unassigned chore");
  
  revalidatePath("/");
  revalidatePath("/chores");
}

export async function approveChore(id: string) {
  const { data: chore } = await supabase.from("chores").select("*").eq("id", id).single();
  if (!chore) throw new Error("Chore not found");
  
  if (chore.status === "completed") {
    const { error } = await supabase.from("chores").update({ status: "approved" }).eq("id", id);
    if (error) throw new Error("Failed to approve chore");
    
    if (chore.assigned_to) {
      await grantPoints(chore.assigned_to, chore.points);
    }
    
    revalidatePath("/");
    revalidatePath("/chores");
  }
}

async function grantPoints(profileId: string, points: number) {
  const { data: profile } = await supabase.from("profiles").select("points_balance, lifetime_points").eq("id", profileId).single();
  if (profile) {
    await supabase.from("profiles").update({ 
      points_balance: profile.points_balance + points,
      lifetime_points: (profile.lifetime_points || 0) + points
    }).eq("id", profileId);
  }
}

async function deductPoints(profileId: string, points: number) {
  const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", profileId).single();
  if (profile) {
    await supabase.from("profiles").update({ points_balance: Math.max(0, profile.points_balance - points) }).eq("id", profileId);
  }
}

export async function manualAdjustPoints(profileId: string, amount: number) {
  if (amount < 0) {
    await deductPoints(profileId, Math.abs(amount));
  } else {
    await grantPoints(profileId, amount);
  }
  revalidatePath("/");
  revalidatePath("/chores");
  revalidatePath("/member/[id]", "page");
  revalidatePath("/rewards");
}

export async function getRewards() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("points_cost", { ascending: true });

  if (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
  return data;
}

export async function getRewardClaims() {
  const { data, error } = await supabase
    .from("reward_claims")
    .select("*, rewards(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching claims:", error);
    return [];
  }
  return data;
}

export async function getGoals() {
  const { data, error } = await supabase
    .from("goals")
    .select("*, profiles(name, avatar_url, points_balance)")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
  return data;
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
  return data;
}

export async function getRules() {
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching rules:", error);
    return [];
  }
  return data;
}

// ---- MUTATION ACTIONS ----

export async function updateFamilySettings(requireApproval: boolean) {
  const family = await getFamily();
  if (family) {
    await supabase.from("families").update({ require_approval: requireApproval }).eq("id", family.id);
    revalidatePath("/settings");
  }
}

export async function addProfile(name: string, role: string) {
  const family = await getFamily();
  if (!family) throw new Error("Family not found");
  
  const { error } = await supabase.from("profiles").insert({
    family_id: family.id,
    name,
    role,
    points_balance: 0
  });
  
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function verifyPin(pin: string) {
  const family = await getFamily();
  if (!family) return false;
  const expectedPin = family.settings_pin || "1234";
  return expectedPin === pin;
}

export async function updatePin(newPin: string) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("families").update({ settings_pin: newPin }).eq("id", family.id);
    if (error) throw new Error(error.message);
    revalidatePath("/settings");
  }
}

export async function removeProfile(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function addChore(title: string, description: string, points: number, assigned_to: string | null, recurrence: string = 'none', due_date: string | null = null, recurrence_day: string | null = null) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("chores").insert({
      family_id: family.id,
      title,
      description,
      points,
      assigned_to: assigned_to || null,
      status: "pending",
      recurrence,
      due_date: due_date || null,
      recurrence_day: recurrence_day || null
    });
    if (error) throw new Error(error.message);
    revalidatePath("/");
    revalidatePath("/chores");
  }
}

export async function editChore(id: string, title: string, points: number, assigned_to: string | null, recurrence: string = 'none', due_date: string | null = null, recurrence_day: string | null = null) {
  const { error } = await supabase.from("chores").update({
    title,
    points,
    assigned_to: assigned_to || null,
    recurrence,
    due_date: due_date || null,
    recurrence_day: recurrence_day || null
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/chores");
}

export async function deleteChore(id: string) {
  const { error } = await supabase.from("chores").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/chores");
}

export async function addReward(title: string, description: string, points_cost: number, image_url: string | null = null) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("rewards").insert({
      family_id: family.id,
      title,
      description,
      points_cost,
      image_url
    });
    if (error) throw new Error(error.message);
    revalidatePath("/rewards");
    revalidatePath("/");
  }
}

export async function editReward(id: string, title: string, description: string, points_cost: number, image_url: string | null = null) {
  const { error } = await supabase.from("rewards").update({
    title,
    description,
    points_cost,
    image_url
  }).eq("id", id);
  
  if (error) throw new Error(error.message);
  revalidatePath("/rewards");
  revalidatePath("/");
}

export async function deleteReward(id: string) {
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rewards");
  revalidatePath("/");
}

export async function uploadRewardImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return null;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `rewards/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from("family-photos")
    .upload(fileName, buffer, { contentType: file.type });
    
  if (error) throw new Error(error.message);
  
  const { data: publicUrlData } = supabase.storage.from("family-photos").getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

export async function uploadProfileImage(profileId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return null;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `profiles/${profileId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { error } = await supabase.storage
    .from("family-photos")
    .upload(fileName, buffer, { contentType: file.type });
    
  if (error) throw new Error(error.message);
  
  const { data: publicUrlData } = supabase.storage.from("family-photos").getPublicUrl(fileName);
  
  // Update the profile record
  await supabase.from("profiles").update({ avatar_url: publicUrlData.publicUrl }).eq("id", profileId);
  
  revalidatePath("/");
  revalidatePath("/member/[id]", "page");
  
  return publicUrlData.publicUrl;
}

export async function addRule(title: string) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("rules").insert({
      family_id: family.id,
      title
    });
    if (error) throw new Error(error.message);
    revalidatePath("/rules");
  }
}

export async function removeRule(id: string) {
  const { error } = await supabase.from("rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
}

export async function addGoal(title: string, target_points: number, profileId: string | null = null, progress_points_reward: number = 20, completion_points_reward: number = 200) {
  const { error } = await supabase.from("goals").insert({
    title,
    target_points,
    current_points: 0,
    profile_id: profileId,
    progress_points_reward,
    completion_points_reward
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
}

export async function removeGoal(id: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
}

export async function claimRewardAction(rewardId: string, profileId: string) {
  // Get the reward cost
  const { data: reward } = await supabase.from("rewards").select("points_cost").eq("id", rewardId).single();
  if (!reward) throw new Error("Reward not found");

  // Get the user's current points
  const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", profileId).single();
  if (!profile || profile.points_balance < reward.points_cost) throw new Error("Not enough points");

  // Deduct the points
  const { error: deductError } = await supabase.from("profiles").update({
    points_balance: profile.points_balance - reward.points_cost
  }).eq("id", profileId);

  if (deductError) throw new Error("Failed to deduct points");

  // Create the claim
  const { error } = await supabase.from("reward_claims").insert({
    reward_id: rewardId,
    kid_id: profileId,
    status: "pending"
  });
  
  if (error) {
    console.error("Error claiming reward:", error);
    // Refund points if claim failed
    await supabase.from("profiles").update({ points_balance: profile.points_balance }).eq("id", profileId);
    throw new Error("Failed to claim reward");
  }
  
  revalidatePath("/rewards");
  revalidatePath("/");
  revalidatePath("/member/[id]", "page");
}

export async function getCalendarLinks() {
  const family = await getFamily();
  if (!family) return [];
  
  const { data, error } = await supabase.from("calendar_links").select("*").eq("family_id", family.id);
  if (error) {
    console.error("Error fetching calendar links:", error);
    return [];
  }
  return data;
}

export async function addCalendarLink(name: string, url: string) {
  const family = await getFamily();
  if (family) {
    const formattedUrl = url.replace(/^webcal:\/\//i, 'https://');
    const { error } = await supabase.from("calendar_links").insert({
      family_id: family.id,
      name,
      url: formattedUrl
    });
    if (error) throw new Error(error.message);
    revalidatePath("/calendar");
    revalidatePath("/");
  }
}

export async function removeCalendarLink(id: string) {
  const { error } = await supabase.from("calendar_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function getEvents() {
  const links = await getCalendarLinks();
  let allEvents: any[] = [];
  
  if (links.length > 0) {
    const ICAL = (await import("ical.js")).default;
    
    // Fetch all calendars concurrently
    const fetchPromises = links.map(async (link) => {
      try {
        const fetchUrl = link.url.replace(/^webcal:\/\//i, 'https://');
        const res = await fetch(fetchUrl, { cache: 'no-store' });
        const text = await res.text();
        
        if (!text.includes("BEGIN:VCALENDAR")) {
          console.warn(`Calendar link ${link.name} did not return valid ICS data. It might be an HTML page.`);
          return [];
        }
        
        // Pre-process text to fix badly folded lines (common in Apple calendars)
        let fixedText = "";
        const lines = text.split(/\r?\n/);
        if (lines.length > 0) {
          fixedText = lines[0] + '\r\n';
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === '') continue;
            // Valid iCal lines either start with space/tab (continuation) or contain : or ;
            if (!line.startsWith(' ') && !line.startsWith('\t') && !line.includes(':') && !line.includes(';')) {
              fixedText += ' ' + line + '\r\n';
            } else {
              fixedText += line + '\r\n';
            }
          }
        } else {
          fixedText = text;
        }
        
        const jcalData = ICAL.parse(fixedText);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");
        
        const urlEvents = vevents.map((vevent: any) => {
          try {
            const event = new ICAL.Event(vevent);
            if (!event.startDate) return null;
            const isAllDay = event.startDate.isDate;
            const startTimeStr = isAllDay ? `${event.startDate.toString()}T00:00:00` : event.startDate.toJSDate().toISOString();
            const endTimeStr = event.endDate ? (event.endDate.isDate ? `${event.endDate.toString()}T00:00:00` : event.endDate.toJSDate().toISOString()) : startTimeStr;
            
            return {
              id: Math.random().toString(),
              title: event.summary || "Busy",
              start_time: startTimeStr,
              end_time: endTimeStr,
              is_all_day: isAllDay,
              location: event.location || null,
              calendar_name: link.name
            };
          } catch (e) {
            return null; // skip invalid event
          }
        }).filter(Boolean); // remove nulls
        
        return urlEvents;
      } catch (err) {
        console.error(`Failed to fetch live calendar (${link.name}):`, err);
        return [];
      }
    });
    
    const results = await Promise.all(fetchPromises);
    allEvents = results.flat();
    allEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  // Also grab any manual DB events just in case
  const { data: dbEvents } = await supabase.from("events").select("*").order("start_time", { ascending: true });
  if (dbEvents && dbEvents.length > 0) {
    allEvents = [...dbEvents, ...allEvents];
  }

  // Inject chores that have a due date
  const { data: dueChores } = await supabase.from("chores")
    .select("id, title, due_date, status, assigned_to, profiles:assigned_to(name)")
    .not("due_date", "is", null);

  if (dueChores && dueChores.length > 0) {
    const choreEvents = dueChores.map((chore: any) => ({
      id: `chore-${chore.id}`,
      title: `📝 ${chore.title} ${chore.profiles ? `(${chore.profiles.name})` : ''}`,
      start_time: `${chore.due_date}T08:00:00`,
      end_time: `${chore.due_date}T09:00:00`,
      is_all_day: true,
      location: chore.status === 'pending' ? 'Not completed' : 'Completed',
      calendar_name: 'Chore Tracker'
    }));
    allEvents = [...allEvents, ...choreEvents];
  }

  return allEvents;
}



// Removing uploadCalendarFile since we're using live URL sync now

export async function logGoalProgress(goalId: string, profileId: string) {
  const { data: goal } = await supabase.from("goals").select("*").eq("id", goalId).single();
  if (!goal) throw new Error("Goal not found");
  
  if (goal.current_points >= goal.target_points) {
    return; // Already completed
  }
  
  // Increment progress by 1 for every click.
  const newAmount = Math.min((goal.current_points || 0) + 1, goal.target_points);
  
  const { error } = await supabase.from("goals").update({ current_points: newAmount }).eq("id", goalId);
  if (error) throw new Error(error.message);
  
  // Grant progress points
  await grantPoints(profileId, goal.progress_points_reward ?? 20);
  
  // Grant completion bonus if hit target
  if (newAmount >= goal.target_points) {
    await grantPoints(profileId, goal.completion_points_reward ?? 200);
  }
  
  revalidatePath("/rules");
  revalidatePath("/");
  revalidatePath("/member/[id]", "page");
}

// ---- BUCKET LIST ACTIONS ----

export async function getBucketListItems() {
  const family = await getFamily();
  if (!family) return [];

  const { data, error } = await supabase
    .from("bucket_list_items")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching bucket list:", error);
    return [];
  }
  return data;
}

export async function addBucketListItem(title: string) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("bucket_list_items").insert({
      family_id: family.id,
      title,
      is_completed: false
    });
    if (error) throw new Error(error.message);
    revalidatePath("/bucket-list");
  }
}

export async function toggleBucketListItem(id: string, isCompleted: boolean) {
  const { error } = await supabase
    .from("bucket_list_items")
    .update({ is_completed: isCompleted })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bucket-list");
}

export async function deleteBucketListItem(id: string) {
  const { error } = await supabase.from("bucket_list_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bucket-list");
}


