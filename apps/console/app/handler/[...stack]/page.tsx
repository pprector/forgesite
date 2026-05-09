import { StackHandler } from "@stackframe/stack";
import { isStackConfigured, stackServerApp } from "@/stack";

export default function Handler(props: unknown) {
  if (!isStackConfigured || !stackServerApp) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="max-w-xl w-full space-y-2">
          <p className="font-bold text-xl">Setup Required</p>
          <p className="text-sm text-muted-foreground">
            Stack Auth 未配置，无法打开登录/注册页面。请先补齐{" "}
            <code>apps/console/.env.local</code>。
          </p>
        </div>
      </div>
    );
  }

  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
