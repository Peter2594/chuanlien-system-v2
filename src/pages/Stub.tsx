import { Construction } from "lucide-react";
import { Card } from "../components/ui/Card";

interface StubProps {
  title: string;
  subtitle?: string;
}

export default function Stub({ title, subtitle = "此模組正在從 v1.0 遷移到 v2.0" }: StubProps) {
  return (
    <div className="max-w-3xl mx-auto py-16">
      <Card className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl mb-6">
          <Construction size={32} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-1">{subtitle}</p>
        <p className="text-xs text-slate-400">
          後端邏輯、Firebase 同步、演算法已準備就緒，UI 將分批遷移
        </p>
      </Card>
    </div>
  );
}
