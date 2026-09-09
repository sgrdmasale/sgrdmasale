import React from 'react';
import { MapPin, User, Phone, Mail } from 'lucide-react';

const ShippingAddressDisplay = ({ address, className = '' }) => {
  if (!address) {
    return (
      <div className={`text-muted-foreground italic text-sm ${className}`}>
        No shipping address provided
      </div>
    );
  } 

  let data = address;
  if (typeof address === 'string') {
    try {
      data = JSON.parse(address);
    } catch (e) {
      // Fallback if string is not valid JSON
      return (
        <div className={`text-sm whitespace-pre-wrap text-foreground ${className}`}>
          {address}
        </div>
      );
    }
  } 

  if (!data || typeof data !== 'object') {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Invalid address format
      </div>
    );
  }

  // Support both detailed fields (street, city) and a single composed 'address' string
  const { name, email, phone, street, city, state, pincode, country, address: fullAddressString } = data; 

  return (
    <div className={`space-y-2.5 ${className}`}>
      {name && (
        <div className="flex items-start gap-2.5">
          <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm text-foreground">{name}</span>
        </div>
      )}
      
      {email && (
        <div className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <a href={`mailto:${email}`} className="text-sm hover:underline text-muted-foreground transition-colors">
            {email}
          </a>
        </div>
      )}
      
      {phone && (
        <div className="flex items-start gap-2.5">
          <Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <a href={`tel:${phone}`} className="text-sm hover:underline text-muted-foreground transition-colors">
            {phone}
          </a>
        </div>
      )}
      
      {(street || city || state || pincode || country || fullAddressString) && (
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex flex-col text-sm text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50 w-full">
            {fullAddressString && <span className="text-foreground">{fullAddressString}</span>}
            {street && <span className="text-foreground">{street}</span>}
            {(city || state || pincode) && (
              <span className="text-foreground">
                {[city, state, pincode].filter(Boolean).join(', ')}
              </span>
            )}
            {country && <span className="text-foreground">{country}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAddressDisplay;