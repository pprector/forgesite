import { buttonVariants } from "@/components/ui/button";
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";

export function Footer(props: {
  productName: string;
  description: string;
  links?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}) {
  const socialLinks = [
    props.links?.twitter
      ? { href: props.links.twitter, icon: TwitterLogoIcon, label: "Twitter" }
      : null,
    props.links?.linkedin
      ? { href: props.links.linkedin, icon: LinkedInLogoIcon, label: "LinkedIn" }
      : null,
    props.links?.github
      ? { href: props.links.github, icon: GitHubLogoIcon, label: "GitHub" }
      : null,
  ].filter(Boolean) as {
    href: string;
    icon: typeof TwitterLogoIcon;
    label: string;
  }[];

  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            <span className="font-medium text-foreground">{props.productName}</span>
            {" · "}
            {props.description}
          </p>
        </div>

        <div className="flex items-center space-x-1">
          {socialLinks.map((link) => (
            <Link
              href={link.href}
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              key={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
            >
              <link.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
