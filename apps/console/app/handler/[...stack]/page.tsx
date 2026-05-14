import { redirect } from "next/navigation";

export default function Handler() {
  redirect("/api/auth/login");
}
