import { redirect } from "next/navigation";

export default function WhgcSeminarsAdminLoginPage() {
  redirect("/manage-console/login?tenant=whgc-seminars");
}
