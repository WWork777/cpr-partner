// One-off: creates an admin user with given email/password and grants admin role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return new Response("missing", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try create; if exists, look up
    let userId: string | null = null;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created?.user) {
      userId = created.user.id;
    } else {
      // find existing
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "no user" }), { status: 500 });
      }
      userId = found.id;
      // reset password just in case
      await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    }

    // Grant admin role
    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
