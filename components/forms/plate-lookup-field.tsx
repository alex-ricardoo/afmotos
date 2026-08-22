'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlateLookupFieldProps {
  onSuccess: (data: any) => void;
}

export function PlateLookupField({ onSuccess }: PlateLookupFieldProps) {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPlate = (value: string) => {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 7);
  };

  const handleSearch = async () => {
    if (plate.length < 7) {
      toast.error('Placa inválida');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/plate-lookup?plate=${plate}`);
      if (!response.ok) throw new Error('Erro na busca');

      const data = await response.json();
      onSuccess(data);
      toast.success('Dados preenchidos automaticamente!');
    } catch (error) {
      toast.error('Não foi possível buscar os dados pela placa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Label htmlFor="plate-lookup" className="text-sm font-semibold text-[#f4f4f2]">
        Consultar Placa{' '}
        <span className="text-xs text-[#a6a6a1] font-normal">(Preenchimento automático)</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id="plate-lookup"
          placeholder="Ex: ABC1D23"
          value={plate}
          onChange={(e) => setPlate(formatPlate(e.target.value))}
          maxLength={7}
          className="bg-black/60 border border-white/15 text-white placeholder:text-zinc-500 rounded-xl h-11 uppercase font-semibold text-base tracking-wider focus:border-[#c9a44c]"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={loading || plate.length < 7}
          className="bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold px-5 h-11 rounded-xl cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" />
          ) : (
            <Search className="w-4 h-4 mr-2 text-black" />
          )}
          Buscar
        </Button>
      </div>
    </div>
  );
}
