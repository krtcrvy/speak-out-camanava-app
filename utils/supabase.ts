import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xlmshoddqaaeazvzuhar.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXNob2RkcWFhZWF6dnp1aGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTQyNDUsImV4cCI6MjA2Mjg5MDI0NX0.-ViKUzQOAOw4b-QyAZpTfDA6qR8HNHNyWWkmHAv40ZQ"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})