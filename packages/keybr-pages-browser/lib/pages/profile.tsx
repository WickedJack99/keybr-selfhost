import { ProfilePage } from "@keybr/page-profile";
import { ResultLoader } from "@keybr/result-loader";

export default function Page() {
  return (
    <ResultLoader>
      <ProfilePage />
    </ResultLoader>
  );
}
