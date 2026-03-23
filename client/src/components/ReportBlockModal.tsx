import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Ban } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

interface ReportBlockModalProps {
  profileId: number;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam lub reklama" },
  { value: "harassment", label: "Nękanie lub groźby" },
  { value: "fake", label: "Fałszywy profil" },
  { value: "inappropriate", label: "Nieodpowiednie treści" },
  { value: "other", label: "Inne" },
];

export default function ReportBlockModal({
  profileId,
  username,
  isOpen,
  onClose,
  onSuccess,
}: ReportBlockModalProps) {
  const [action, setAction] = useState<"report" | "block" | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reports", {
        reportedProfileId: profileId,
        reason,
        description,
      });
    },
    onSuccess: () => {
      toast({ title: "Dziękujemy za zgłoszenie. Sprawdzimy to." });
      queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Błąd podczas zgłaszania", variant: "destructive" });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/blocks", { blockedProfileId: profileId });
    },
    onSuccess: () => {
      toast({ title: `Zablokowałeś ${username}. Nie będzie mógł Cię kontaktować.` });
      queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Błąd podczas blokowania", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setAction(null);
    setReason("");
    setDescription("");
    onClose();
  };

  const handleReport = () => {
    if (!reason) {
      toast({ title: "Wybierz powód zgłoszenia", variant: "destructive" });
      return;
    }
    reportMutation.mutate();
  };

  const handleBlock = () => {
    blockMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!action ? (
          <>
            <DialogHeader>
              <DialogTitle>Zgłoś lub zablokuj</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mb-4">@{username}</p>

            <div className="space-y-3">
              <Button
                onClick={() => setAction("report")}
                variant="outline"
                className="w-full justify-start gap-2"
                data-testid="button-report"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Zgłoś profil
              </Button>

              <Button
                onClick={() => setAction("block")}
                variant="outline"
                className="w-full justify-start gap-2"
                data-testid="button-block"
              >
                <Ban className="w-4 h-4 text-destructive" />
                Zablokuj użytkownika
              </Button>

              <Button onClick={handleClose} variant="ghost" className="w-full" data-testid="button-cancel">
                Anuluj
              </Button>
            </div>
          </>
        ) : action === "report" ? (
          <>
            <DialogHeader>
              <DialogTitle>Zgłoś profil</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Powód *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger data-testid="select-reason">
                    <SelectValue placeholder="Wybierz powód" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Opis (opcjonalnie)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReport}
                  disabled={!reason || reportMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-report"
                >
                  {reportMutation.isPending ? "Wysyłanie..." : "Zgłoś"}
                </Button>
                <Button onClick={() => setAction(null)} variant="outline" className="flex-1">
                  Wstecz
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Zablokuj użytkownika</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground mb-4">
              Czy na pewno chcesz zablokować <strong>@{username}</strong>?
            </p>

            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>Po zablokowaniu:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Nie będzie mógł wysyłać Ci wiadomości</li>
                <li>Nie zobaczysz jego profilu</li>
                <li>Nie zobaczy Twojego profilu</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleBlock}
                disabled={blockMutation.isPending}
                variant="destructive"
                className="flex-1"
                data-testid="button-confirm-block"
              >
                {blockMutation.isPending ? "Blokowanie..." : "Zablokuj"}
              </Button>
              <Button onClick={() => setAction(null)} variant="outline" className="flex-1">
                Wstecz
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
