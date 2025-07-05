import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countries, type Country } from '@/lib/countries';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({ value = '', onChange, placeholder = 'Phone number', disabled = false, className }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'BH') || countries[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value) {
      // Try to parse existing value to extract country code and number
      const country = countries.find(c => value.startsWith(c.phoneCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.phoneCode, ''));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    const fullNumber = country.phoneCode + phoneNumber;
    onChange?.(fullNumber);
    setOpen(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setPhoneNumber(number);
    const fullNumber = selectedCountry.phoneCode + number;
    onChange?.(fullNumber);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[120px] justify-between"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.phoneCode}`}
                    onSelect={() => handleCountryChange(country)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCountry.code === country.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="text-xl mr-3">{country.flag}</span>
                    <span className="flex-1 font-medium">{country.name}</span>
                    <span className="text-sm text-muted-foreground font-medium">{country.phoneCode}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}