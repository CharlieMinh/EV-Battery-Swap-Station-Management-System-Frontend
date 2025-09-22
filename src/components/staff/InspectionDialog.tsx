import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Camera, FileText } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface InspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InspectionDialog({ isOpen, onClose }: InspectionDialogProps) {
  const { t } = useLanguage();

  const inspectionItems = [
    t("staff.physicalDamage"),
    t("staff.connectorInspection"),
    t("staff.temperatureReading"),
    t("staff.voltageTest"),
    t("staff.capacityVerification"),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("staff.batteryReturnInspection")}</DialogTitle>
          <DialogDescription>
            {t("staff.batteryReturnInspectionDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("staff.batteryId")}</Label>
              <p className="font-mono">BAT-2024-001</p>
            </div>
            <div>
              <Label>{t("staff.customer")}</Label>
              <p className="font-medium">Alex Chen</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">{t("staff.inspectionChecklist")}</h4>
            <div className="space-y-2">
              {inspectionItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t("staff.inspectionNotes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("staff.inspectionNotesPlaceholder")}
            />
          </div>

          <div>
            <Label>{t("staff.photoDocumentation")}</Label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" /> {t("staff.takePhoto")}
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" /> {t("staff.uploadFile")}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onClose}>{t("staff.completeInspection")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
