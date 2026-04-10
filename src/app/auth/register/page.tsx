import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/auth/login?error=signup_disabled");
}
