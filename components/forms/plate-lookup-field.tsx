"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlateLookupFieldProps {
  onSuccess: (data: any) => void;
}

export function PlateLookupField({ onSuccess }: PlateLookupFieldProps) {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPlate = (value: string) => {
    // Basic Mercosul/Old formatting (XXX-0000 or XXX0X00)
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  const handleSearch = async () => {
    if (plate.length < 7) {
      toast.error("Placa inválida");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/plate-lookup?plate=${plate}`);
      if (!response.ok) throw new Error("Erro na busca");
      
      const data = await response.json();
      onSuccess(data);
      toast.success("Dados preenchidos automaticamente");
    } catch (error) {
      toast.error("Não foi possível buscar os dados pela placa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="plate-lookup">Consultar Placa (Preenchimento automático)</Label>
      <div className="flex gap-2">
        <Input
          id="plate-lookup"
          placeholder="ABC1D23"
          value={plate}
          onChange={(e) => setPlate(formatPlate(e.target.value))}
          maxLength={7}
        />
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleSearch}
          disabled={loading || plate.length < 7}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Buscar
        </Button>
      </div>
    </div>
  );
}
