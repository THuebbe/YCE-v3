import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { supabase } from '@/lib/db/supabase-client'

// Disable body parser to get raw body for webhook verification
export const runtime = 'nodejs'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or environment variables')
}

// TypeScript assertion since we've already checked it exists
const secret: string = webhookSecret

export async function POST(req: NextRequest) {
  console.log('🔗 Clerk webhook: Received webhook request')
  
  try {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('🔗 Clerk webhook: Missing svix headers')
      return new Response('Error occurred -- no svix headers', {
        status: 400,
      })
    }

    // Get the body
    const payload = await req.text()
    const body = JSON.parse(payload)

    // Create a new Svix instance with your secret
    const wh = new Webhook(secret)

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('🔗 Clerk webhook: Error verifying webhook:', err)
      return new Response('Error occurred', {
        status: 400,
      })
    }

    // Handle the webhook
    const eventType = evt.type
    console.log('🔗 Clerk webhook: Event type:', eventType)

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data
      
      console.log('🔗 Clerk webhook: Creating user in Supabase:', {
        id,
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name
      })

      try {
        // Create user in Supabase
        const { data, error } = await supabase
          .from('users')
          .insert({
            id,
            email: email_addresses[0]?.email_address,
            firstName: first_name,
            lastName: last_name,
            role: 'USER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error('🔗 Clerk webhook: Error creating user in Supabase:', error)
          return new Response('Error creating user in database', { status: 500 })
        }

        console.log('🔗 Clerk webhook: ✅ User created successfully in Supabase:', data?.id)
      } catch (dbError) {
        console.error('🔗 Clerk webhook: Database exception:', dbError)
        return new Response('Database error', { status: 500 })
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data
      
      console.log('🔗 Clerk webhook: Updating user in Supabase:', id)

      try {
        const { error } = await supabase
          .from('users')
          .update({
            email: email_addresses[0]?.email_address,
            firstName: first_name,
            lastName: last_name,
            updatedAt: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('🔗 Clerk webhook: Error updating user in Supabase:', error)
          return new Response('Error updating user in database', { status: 500 })
        }

        console.log('🔗 Clerk webhook: ✅ User updated successfully in Supabase')
      } catch (dbError) {
        console.error('🔗 Clerk webhook: Database exception during update:', dbError)
        return new Response('Database error', { status: 500 })
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data
      
      console.log('🔗 Clerk webhook: Deleting user from Supabase:', id)

      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('🔗 Clerk webhook: Error deleting user from Supabase:', error)
          return new Response('Error deleting user from database', { status: 500 })
        }

        console.log('🔗 Clerk webhook: ✅ User deleted successfully from Supabase')
      } catch (dbError) {
        console.error('🔗 Clerk webhook: Database exception during deletion:', dbError)
        return new Response('Database error', { status: 500 })
      }
    }

    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
    console.error('🔗 Clerk webhook: Unexpected error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}