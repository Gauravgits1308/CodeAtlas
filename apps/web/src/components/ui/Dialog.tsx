import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#070A13]/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal Card */}
      <div className="relative bg-[#0F1320] border border-border/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 hover:bg-[#1E2538]/50 rounded-lg transition-all cursor-pointer"
        >
          <X className="size-4" />
        </button>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
