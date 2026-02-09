import { redirect } from "next/navigation";

export default function WhgcSeminarsAdminLoginPage() {
  redirect("/admin/login?tenant=whgc-seminars");
}
