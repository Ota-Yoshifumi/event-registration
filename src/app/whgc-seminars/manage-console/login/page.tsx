import { redirect } from "next/navigation";

export default function WhgcSeminarsAdminLoginPage() {
  redirect("/super-manage-console/login?tenant=whgc-seminars");
}
