import { Metadata } from "next";
import { MaterialsClient } from "./page-client";

export const metadata: Metadata = {
  title: "素材库 - ForgeSite Console",
};

export default function MaterialsPage() {
  return <MaterialsClient />;
}
