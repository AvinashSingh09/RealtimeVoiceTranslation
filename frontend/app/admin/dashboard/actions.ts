'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export async function createNewRoom() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const roomId = uuidv4()

    const { error: dbError } = await supabase
        .from('rooms')
        .insert({
            id: roomId,
            admin_id: user.id,
            voice_model: 'Standard',
            voice_gender: 'NEUTRAL',
            voice_prompt: '',
            created_at: new Date().toISOString()
        })

    if (dbError) {
        console.error('Failed to create room:', dbError)
        throw new Error('Failed to initialize database room')
    }

    revalidatePath('/admin/dashboard')
    redirect(`/admin/${roomId}`)
}

export async function deleteRoom(formData: FormData) {
    const roomId = formData.get('roomId') as string
    if (!roomId) return

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const { error: dbError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('admin_id', user.id)

    if (dbError) {
        console.error('Failed to delete room:', dbError)
        throw new Error('Failed to delete database room')
    }

    revalidatePath('/admin/dashboard')
}
