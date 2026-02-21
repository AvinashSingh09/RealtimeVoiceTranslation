import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminClient';

export default async function AdminDashboardPage({ params }: { params: Promise<{ roomId: string }> }) {
    const supabase = await createClient();

    // 1. Authenticate user securely on the server
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 2. If no user, kick them to login
    if (authError || !user) {
        redirect('/login');
    }

    // 3. User is authenticated and allowed to configure rooms
    return <AdminDashboardClient params={params} />;
}
