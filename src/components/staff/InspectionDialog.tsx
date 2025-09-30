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
      <DialogContent className="max-w-xl border border-orange-200 rounded-lg bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-orange-600 text-2xl font-bold">
            {t("staff.batteryReturnInspection")}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t("staff.batteryReturnInspectionDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-orange-100">
            <div>
              <Label className="text-orange-600 font-medium">{t("staff.batteryId")}</Label>
              <p className="font-mono">BAT-2024-001</p>
            </div>
            <div>
              <Label className="text-orange-600 font-medium">{t("staff.customer")}</Label>
              <p className="font-medium text-black">Alex Chen</p>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-orange-100">
            <h4 className="font-bold text-orange-600">{t("staff.inspectionChecklist")}</h4>
            <div className="space-y-2">
              {inspectionItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-orange-400" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-orange-100">
            <Label htmlFor="notes" className="text-orange-600 font-medium">{t("staff.inspectionNotes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("staff.inspectionNotesPlaceholder")}
              className="mt-2"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-orange-100">
            <Label className="text-orange-600 font-medium">{t("staff.photoDocumentation")}</Label>
            <div className="flex space-x-2 mt-2">
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" /> {t("staff.takePhoto")}
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" /> {t("staff.uploadFile")}
              </Button>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={onClose}>
              {t("staff.completeInspection")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
