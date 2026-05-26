"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getFamily() {
  const { data, error } = await supabase.from("families").select("*").limit(1).single();
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

  // --- Auto-Reset Daily Chores Logic ---
  // We use the local time date string (YYYY-MM-DD)
  const today = new Date();
  // Adjust to local timezone rough offset for "today"
  const todayDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  if (family.last_daily_reset !== todayDate) {
    // It's a new day! Reset all daily chores
    await supabase
      .from("chores")
      .update({ status: "pending" })
      .eq("family_id", family.id)
      .eq("is_daily", true);
      
    await supabase
      .from("families")
      .update({ last_daily_reset: todayDate })
      .eq("id", family.id);
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
  const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", profileId).single();
  if (profile) {
    await supabase.from("profiles").update({ points_balance: profile.points_balance + points }).eq("id", profileId);
  }
}

async function deductPoints(profileId: string, points: number) {
  const { data: profile } = await supabase.from("profiles").select("points_balance").eq("id", profileId).single();
  if (profile) {
    await supabase.from("profiles").update({ points_balance: Math.max(0, profile.points_balance - points) }).eq("id", profileId);
  }
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

export async function addChore(title: string, description: string, points: number, assigned_to: string, is_daily: boolean = false) {
  const family = await getFamily();
  if (family) {
    const { error } = await supabase.from("chores").insert({
      family_id: family.id,
      title,
      description,
      points,
      assigned_to,
      status: "pending",
      is_daily
    });
    if (error) throw new Error(error.message);
    revalidatePath("/");
    revalidatePath("/chores");
  }
}

export async function addReward(title: string, description: string, points_cost: number) {
  const { error } = await supabase.from("rewards").insert({
    title,
    description,
    points_cost
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rewards");
}

export async function addRule(title: string) {
  const { error } = await supabase.from("rules").insert({
    title
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
}

export async function addGoal(title: string, target_points: number, profileId: string | null = null) {
  const { error } = await supabase.from("goals").insert({
    title,
    target_points,
    current_points: 0,
    profile_id: profileId
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
}

export async function claimRewardAction(rewardId: string) {
  const { error } = await supabase.from("reward_claims").insert({
    reward_id: rewardId,
    status: "pending"
  });
  
  if (error) {
    console.error("Error claiming reward:", error);
    throw new Error("Failed to claim reward");
  }
  
  revalidatePath("/rewards");
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
    const { error } = await supabase.from("calendar_links").insert({
      family_id: family.id,
      name,
      url
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
        const res = await fetch(link.url, { cache: 'no-store' });
        const text = await res.text();
        
        if (!text.includes("BEGIN:VCALENDAR")) {
          console.warn(`Calendar link ${link.name} did not return valid ICS data. It might be an HTML page.`);
          return [];
        }
        
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");
        
        const urlEvents = vevents.map((vevent: any) => {
          try {
            const event = new ICAL.Event(vevent);
            if (!event.startDate) return null;
            return {
              id: Math.random().toString(),
              title: event.summary || "Busy",
              start_time: event.startDate.toJSDate().toISOString(),
              end_time: event.endDate ? event.endDate.toJSDate().toISOString() : event.startDate.toJSDate().toISOString(),
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

  return allEvents;
}



// Removing uploadCalendarFile since we're using live URL sync now

export async function logGoalProgress(goalId: string) {
  const { data: goal } = await supabase.from("goals").select("*").eq("id", goalId).single();
  if (!goal) throw new Error("Goal not found");
  
  // Increment progress visually by 10 points/units for every click.
  const newAmount = Math.min((goal.current_points || 0) + 10, goal.target_points);
  
  const { error } = await supabase.from("goals").update({ current_points: newAmount }).eq("id", goalId);
  if (error) throw new Error(error.message);
  revalidatePath("/rules");
  revalidatePath("/");
}


