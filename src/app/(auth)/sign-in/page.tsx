import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center w-full">
      <SignIn
        appearance={{
          elements: {
            cardBox: "w-full shadow-none border-none bg-transparent",
            card: "bg-transparent border-none shadow-none w-full p-0",
            headerTitle: "text-foreground font-bold text-2xl tracking-tight text-center",
            headerSubtitle: "text-muted-foreground text-sm text-center",
            socialButtonsBlockButton: "bg-[#111827] border border-border/60 hover:bg-muted/40 text-foreground transition-all",
            socialButtonsBlockButtonText: "text-foreground font-semibold",
            dividerLine: "bg-border/20",
            dividerText: "text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider",
            formFieldLabel: "text-muted-foreground uppercase text-[10px] tracking-wider font-semibold",
            formFieldInput: "bg-[#111827] border border-border/60 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-mono text-sm rounded-lg h-10",
            formButtonPrimary: "bg-primary hover:bg-primary/95 text-white font-semibold shadow-md transition-all cursor-pointer h-10",
            footerActionText: "text-muted-foreground text-xs",
            footerActionLink: "text-primary hover:underline font-semibold",
            formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
          },
        }}
      />
    </div>
  )
}
