import "./v2.css";
import { V2Shell } from "@/components/v2/shell";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <V2Shell>{children}</V2Shell>;
}
