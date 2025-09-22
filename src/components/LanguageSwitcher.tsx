import React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage, type Language } from "./LanguageContext";

interface LanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en" as Language, label: "English", flag: "🇺🇸" },
    { code: "vi" as Language, label: "Tiếng Việt", flag: "🇻🇳" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="flex items-center space-x-2"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.flag} {currentLanguage?.code.toUpperCase()}
          </span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center space-x-2 ${
              language === lang.code ? "bg-accent" : ""
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
