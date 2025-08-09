import { supabase } from "@/integrations/supabase/client";

// Simple test to validate interactions table functionality
async function testInteractionInsert() {
  console.log('Testing interaction insert...');
  
  try {
    // Test direct insert to interactions table
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        query_id: '5c90a04e-9f51-4e35-936d-fd0c237c96fa', // Using existing query ID
        clicked_url: 'https://test-tracking.com',
        clicked_rank: 1,
        interaction_type: 'click',
        element_id: 'test_button',
        element_text: 'Test Click'
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Failed to insert interaction:', error);
      return false;
    } else {
      console.log('✅ Interaction inserted successfully:', data);
      return true;
    }
  } catch (err) {
    console.error('Exception during interaction insert:', err);
    return false;
  }
}

// Run the test
testInteractionInsert().then(success => {
  if (success) {
    console.log('🎉 Interactions table is working correctly!');
  } else {
    console.log('❌ Interactions table has issues');
  }
});

export { testInteractionInsert };