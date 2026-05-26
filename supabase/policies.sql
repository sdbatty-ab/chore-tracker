-- For development purposes, we will allow all access to the public role.
-- In a production environment, you would restrict this to authenticated users based on family_id.

CREATE POLICY "Allow public read access on families" ON public.families FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on families" ON public.families FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on families" ON public.families FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on chores" ON public.chores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on chores" ON public.chores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on chores" ON public.chores FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on rewards" ON public.rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on rewards" ON public.rewards FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on reward_claims" ON public.reward_claims FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reward_claims" ON public.reward_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reward_claims" ON public.reward_claims FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on rules" ON public.rules FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on rules" ON public.rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on rules" ON public.rules FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on goals" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on goals" ON public.goals FOR UPDATE USING (true);

-- Storage policies for family-photos bucket
-- Allow public access to view and upload
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'family-photos');
CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family-photos');
