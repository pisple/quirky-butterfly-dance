// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://crmkqpaxvtfgatiuheiq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybWtxcGF4dnRmZ2F0aXVoZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzE3MjcsImV4cCI6MjA1OTQ0NzcyN30.WD8PqHgNCv7BHx-2vCqCQPj0-IaX1VgzkwHL7O2mU-4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);