import { Card } from "@/components/ui/card";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Card className="w-full max-w-md p-6 bg-gray-900 border-gray-800">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>

        {children}
      </Card>
    </div>
  );
}