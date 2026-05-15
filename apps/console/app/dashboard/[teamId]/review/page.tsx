import { Metadata } from "next";
import { ReviewClient } from "./page-client";

export const metadata: Metadata = {
  title: "信息审核 - ForgeSite Console",
};

export default function ReviewPage() {
  return <ReviewClient />;
}
