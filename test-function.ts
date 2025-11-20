import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(JSON.stringify({ 
    message: "BitGo function working",
    address: "bc1qtest123456789",
    isReal: false
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})