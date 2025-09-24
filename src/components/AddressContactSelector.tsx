import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  state: string;
  label: string;
  created_at: string;
}

interface Contact {
  id: string;
  user_id: string;
  whatsapp_number: string;
  label: string;
  created_at: string;
}

interface AddressContactSelectorProps {
  selectedAddress?: Address;
  selectedContact?: Contact;
  onAddressSelect: (address: Address) => void;
  onContactSelect: (contact: Contact) => void;
}

const AddressContactSelector: React.FC<AddressContactSelectorProps> = ({
  selectedAddress,
  selectedContact,
  onAddressSelect,
  onContactSelect,
}) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    label: '',
  });
  const [newContact, setNewContact] = useState({
    whatsapp_number: '',
    label: '',
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadContacts();
    }
  }, [user]);

  const loadAddresses = async () => {
    // Mock addresses for now until user_addresses table is created
    setAddresses([]);
  };

  const loadContacts = async () => {
    // Mock contacts for now until user_contacts table is created
    setContacts([]);
  };

  const addAddress = async (newAddressData: Omit<Address, 'id' | 'user_id' | 'created_at'>) => {
    const addressWithId: Address = {
      id: Math.random().toString(),
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      ...newAddressData
    };

    // Mock adding address for now
    setAddresses(prev => [...prev, addressWithId]);
    setIsAddressDialogOpen(false);
    setNewAddress({ street: '', city: '', state: '', label: '' });
  };

  const addContact = async (newContactData: Omit<Contact, 'id' | 'user_id' | 'created_at'>) => {
    const contactWithId: Contact = {
      id: Math.random().toString(),
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      ...newContactData
    };

    // Mock adding contact for now
    setContacts(prev => [...prev, contactWithId]);
    setIsContactDialogOpen(false);
    setNewContact({ whatsapp_number: '', label: '' });
  };

  const deleteAddress = async (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const deleteContact = async (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Addresses Section */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-primary" />
              Delivery Addresses
            </CardTitle>
            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="address-label">Label</Label>
                    <Input
                      id="address-label"
                      placeholder="e.g., Home, Office"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="Enter street address"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => addAddress(newAddress)} 
                    className="w-full"
                    disabled={!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state}
                  >
                    Add Address
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No addresses added yet</p>
          ) : (
            <div className="grid gap-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAddress?.id === address.id 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/30 hover:bg-accent/50'
                  }`}
                  onClick={() => onAddressSelect(address)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{address.label}</Badge>
                      </div>
                      <p className="text-sm font-medium">{address.street}</p>
                      <p className="text-sm text-muted-foreground">{address.city}, {address.state}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(address.id);
                      }}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Phone className="h-5 w-5 text-primary" />
              WhatsApp Contacts
            </CardTitle>
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-label">Label</Label>
                    <Input
                      id="contact-label"
                      placeholder="e.g., Primary, Secondary"
                      value={newContact.label}
                      onChange={(e) => setNewContact(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      placeholder="+234 XXX XXX XXXX"
                      value={newContact.whatsapp_number}
                      onChange={(e) => setNewContact(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    />
                  </div>
                  <Button 
                    onClick={() => addContact(newContact)} 
                    className="w-full"
                    disabled={!newContact.label || !newContact.whatsapp_number}
                  >
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No contacts added yet</p>
          ) : (
            <div className="grid gap-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedContact?.id === contact.id 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/30 hover:bg-accent/50'
                  }`}
                  onClick={() => onContactSelect(contact)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{contact.label}</Badge>
                      </div>
                      <p className="text-sm font-medium">{contact.whatsapp_number}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContact(contact.id);
                      }}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressContactSelector;