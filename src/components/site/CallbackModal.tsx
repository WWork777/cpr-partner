import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApplicationForm } from "./ApplicationForm";

type Props = {
  trigger: ReactNode;
  courseId?: string;
  courseTitle?: string;
  title?: string;
};

export function CallbackModal({ trigger, courseId, courseTitle, title = "Заказать обратный звонок" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90dvh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>
            Оставьте контакты — менеджер перезвонит в течение рабочего дня.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <ApplicationForm
            variant="compact"
            courseId={courseId}
            courseTitle={courseTitle}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
