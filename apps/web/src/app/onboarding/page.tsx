"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  Check, 
  Github, 
  Search, 
  Loader2, 
  ArrowRight, 
  FolderGit2
} from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useRepositorySync } from "@/hooks/useRepositorySync";

interface GitHubRepositoryDto {
  githubRepoId: string;
  name: string;
  fullName: string;
  owner: string;
  visibility: "public" | "private";
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  watchers: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Onboarding Wizard step: 1 (Account Created), 2 (Connect GitHub), 3 (Import Repository), 4 (Indexing & Open)
  const [currentStep, setCurrentStep] = React.useState(2);
  const [isGithubConnected, setIsGithubConnected] = React.useState<boolean | null>(null);
  const [gitRepos, setGitRepos] = React.useState<GitHubRepositoryDto[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoadingRepos, setIsLoadingRepos] = React.useState(false);
  const [importedRepoId, setImportedRepoId] = React.useState<string | null>(null);
  const [importedRepoName, setImportedRepoName] = React.useState<string>("");
  const [isImporting, setIsImporting] = React.useState(false);

  // Clerk action to trigger GitHub account connection link popup
  const handleConnectGithub = async () => {
    if (!user) return;
    try {
      const extAcc = await user.createExternalAccount({
        strategy: "oauth_github",
        redirectUrl: window.location.origin + "/onboarding",
      });
      if (extAcc?.verification?.externalVerificationRedirectURL) {
        window.location.href = extAcc.verification.externalVerificationRedirectURL.toString();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to trigger GitHub authorization flow.");
    }
  };

  // Check connection status and load repos if connected
  const checkConnection = React.useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const response = await api.get<{ success: boolean; githubConnected?: boolean; repositories: GitHubRepositoryDto[] }>(
        "/v1/github/repositories"
      );
      if (response.success) {
        const connected = response.githubConnected !== false;
        setIsGithubConnected(connected);
        if (connected) {
          setGitRepos(response.repositories || []);
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to verify GitHub connection:", err);
      setIsGithubConnected(false);
      setCurrentStep(2);
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isUserLoaded) return;
    const timer = setTimeout(() => {
      checkConnection();
    }, 50);
    return () => clearTimeout(timer);
  }, [isUserLoaded, checkConnection]);

  // Submit import payload to trigger indexer job pipeline
  const handleImportRepo = async (repo: GitHubRepositoryDto) => {
    if (isImporting) return;
    setIsImporting(true);
    setImportedRepoName(repo.name);

    const payload = {
      githubRepoId: repo.githubRepoId,
      name: repo.name,
      fullName: repo.fullName,
      owner: repo.owner,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch,
      cloneUrl: repo.cloneUrl,
      htmlUrl: repo.htmlUrl,
      description: repo.description,
      primaryLanguage: repo.primaryLanguage,
      stars: repo.stars,
      forks: repo.forks,
      watchers: repo.watchers,
    };

    try {
      const response = await api.post<{ success: boolean; repositories: { id: string }[] }>(
        "/v1/repositories/import",
        { repositories: [payload] }
      );

      if (response.success && response.repositories.length > 0) {
        setImportedRepoId(response.repositories[0].id);
        setCurrentStep(4);
      } else {
        toast.error("Failed to initiate repository import.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Error occurred during repository import setup.");
    } finally {
      setIsImporting(false);
    }
  };

  // Poll sync progress if imported repository exists
  const syncState = useRepositorySync(importedRepoId || "", "QUEUED");

  const filteredRepos = React.useMemo(() => {
    return gitRepos.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [gitRepos, searchQuery]);

  if (!isUserLoaded || isGithubConnected === null) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center select-none font-sans">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-16 min-h-screen bg-[#070A13] text-foreground font-sans relative overflow-hidden flex flex-col justify-center select-none">
      {/* Background blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E2638_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.18] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none blur-[140px]" />

      <Container className="max-w-2xl space-y-10 relative z-10 my-auto">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">Welcome to Revora</h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Let&apos;s get you set up and exploring your repository intelligence workspace.
          </p>
        </div>

        {/* Horizontal steps timeline bar indicator */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/10 max-w-md mx-auto">
          {[
            { id: 1, label: "Account" },
            { id: 2, label: "GitHub" },
            { id: 3, label: "Import" },
            { id: 4, label: "Workspace" },
          ].map((s) => {
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;
            return (
              <div key={s.id} className="space-y-1.5 flex flex-col items-center">
                <div
                  className={`size-6 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-primary/20 border-primary text-primary"
                      : isActive
                      ? "bg-[#111625] border-primary text-foreground ring-2 ring-primary/20"
                      : "bg-zinc-900/40 border-border/10 text-muted-foreground/60"
                  }`}
                >
                  {isCompleted ? <Check className="size-3" /> : s.id}
                </div>
                <span
                  className={`text-[9px] font-mono font-semibold uppercase tracking-wider ${
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic step body containers */}
        <div className="bg-[#111625]/30 border border-border/10 rounded-2xl p-8 backdrop-blur-md shadow-xl max-w-md mx-auto">
          
          {/* STEP 2: CONNECT GITHUB */}
          {currentStep === 2 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 bg-[#1F293D]/30 border border-border/10 rounded-2xl">
                  <Github className="size-10 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-foreground">Connect your GitHub Account</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your GitHub account to import repositories, generate documentation, visualize architecture, and chat with your codebase.
                </p>
              </div>
              <Button
                onClick={handleConnectGithub}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold cursor-pointer rounded-xl flex items-center justify-center gap-2"
              >
                <span>Connect GitHub</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* STEP 3: IMPORT FIRST REPOSITORY */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-bold text-foreground">Import your first repository</h3>
                  <p className="text-xs text-muted-foreground">Select a codebase from your GitHub profile to index.</p>
                </div>
                <button
                  onClick={handleConnectGithub}
                  className="text-[9px] font-mono text-primary hover:underline font-bold shrink-0 cursor-pointer"
                >
                  Switch Account
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full bg-zinc-950 border border-border/10 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-muted-foreground/35 outline-none focus:border-primary/50 text-foreground"
                />
              </div>

              {/* Repos list container */}
              <div className="max-h-56 overflow-y-auto border border-border/5 rounded-xl divide-y divide-border/5 bg-zinc-950/20 select-none">
                {isLoadingRepos ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-xs font-mono text-muted-foreground">
                    <Loader2 className="size-5 text-primary animate-spin" />
                    <span>Loading repositories...</span>
                  </div>
                ) : filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.githubRepoId}
                      className="p-3 flex items-center justify-between hover:bg-[#1E2538]/20 transition-all group"
                    >
                      <div className="space-y-0.5 truncate pr-3 text-left">
                        <span className="text-xs font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                          {repo.name}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground block truncate">
                          {repo.owner}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleImportRepo(repo)}
                        disabled={isImporting}
                        className="h-7 text-[10px] bg-primary/10 hover:bg-primary hover:text-white border border-primary/20 text-primary cursor-pointer font-bold shrink-0 rounded-lg"
                      >
                        {isImporting && importedRepoName === repo.name ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Import"
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground font-mono italic">
                    No repositories found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: INDEXING & EXPLORATION READY */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 bg-[#1F293D]/30 border border-border/10 rounded-2xl relative">
                  <FolderGit2 className="size-10 text-primary" />
                  {syncState?.status !== "COMPLETED" && (
                    <span className="absolute top-1 right-1 flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2.5 bg-blue-500"></span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">
                  {syncState?.status === "COMPLETED" ? "Workspace index compiled!" : "Analyzing codebase files..."}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {syncState?.status === "COMPLETED"
                    ? `Ast index mapping successfully generated for ${importedRepoName || "repository"}.`
                    : `We are scanning controllers, models, and embeddings for ${importedRepoName || "repository"}.`}
                </p>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                  <span>{syncState?.currentStage || "Indexing"}</span>
                  <span>{syncState?.progress || 0}%</span>
                </div>
                <div className="w-full bg-[#1E2538] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${syncState?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              {syncState?.status === "COMPLETED" ? (
                <Button
                  onClick={() => router.push(`/dashboard/repository/${importedRepoId}/chat`)}
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <div className="flex justify-center items-center gap-1.5 text-[10px] font-mono text-muted-foreground py-1">
                  <Loader2 className="size-3 animate-spin text-primary" />
                  <span>Do not close this window during compilation...</span>
                </div>
              )}
            </div>
          )}

        </div>
      </Container>
    </div>
  );
}
