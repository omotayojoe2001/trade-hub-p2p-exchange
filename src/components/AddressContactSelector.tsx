import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Phone, Edit2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  label: string;
}

interface Contact {
  id: string;
  phone_number: string;
  whatsapp_number: string;
  label: string;
}

interface AddressContactSelectorProps {
  onAddressSelect: (address: Address) => void;
  onContactSelect: (contact: Contact) => void;
  selectedAddress?: Address;
  selectedContact?: Contact;
  showAddressSection?: boolean;
  prefilledAddress?: Address;
  prefilledContact?: Contact;
}

export const AddressContactSelector: React.FC<AddressContactSelectorProps> = ({
  onAddressSelect,
  onContactSelect,
  selectedAddress,
  selectedContact,
  showAddressSection = true,
  prefilledAddress,
  prefilledContact
}) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    landmark: '',
    label: ''
  });
  const [newContact, setNewContact] = useState({
    phone_number: '',
    whatsapp_number: '',
    label: ''
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadContacts();
    }
  }, [user]);

  useEffect(() => {
    // Auto-select prefilled data if provided
    if (prefilledAddress && !selectedAddress) {
      onAddressSelect(prefilledAddress);
    }
    if (prefilledContact && !selectedContact) {
      onContactSelect(prefilledContact);
    }
  }, [prefilledAddress, prefilledContact]);

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setAddresses(data);
  };

  const loadContacts = async () => {
    const { data } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setContacts(data);
  };

  const saveAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.label) return;

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: user?.id,
        ...newAddress
      })
      .select()
      .single();

    if (!error && data) {
      setAddresses(prev => [data, ...prev]);
      onAddressSelect(data);
      setNewAddress({ street: '', city: '', state: '', landmark: '', label: '' });
      setShowAddAddress(false);
    }
  };

  const saveContact = async () => {
    if (!newContact.phone_number || !newContact.whatsapp_number || !newContact.label) return;

    const { data, error } = await supabase
      .from('user_contacts')
      .insert({
        user_id: user?.id,
        ...newContact
      })
      .select()
      .single();

    if (!error && data) {
      setContacts(prev => [data, ...prev]);
      onContactSelect(data);
      setNewContact({ phone_number: '', whatsapp_number: '', label: '' });
      setShowAddContact(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Address Selection */}
      {showAddressSection && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Delivery Address
          </h3>
          
          {/* Prefilled Address */}
          {prefilledAddress && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">From Premium Settings:</p>
                  <p className="font-medium text-gray-900">{prefilledAddress.label}</p>
                  <p className="text-sm text-gray-600">
                    {prefilledAddress.street}, {prefilledAddress.city}, {prefilledAddress.state}
                  </p>
                </div>
                <Button
                  onClick={() => onAddressSelect(prefilledAddress)}
                  size="sm"
                  variant={selectedAddress?.id === prefilledAddress.id ? "default" : "outline"}
                >
                  {selectedAddress?.id === prefilledAddress.id ? 'Selected' : 'Use This'}
                </Button>
              </div>
            </div>
          )}
        
        <div className="space-y-3">
          {addresses.map((address) => (
            <button
              key={address.id}
              onClick={() => onAddressSelect(address)}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                selectedAddress?.id === address.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{address.label}</div>
                  <div className="text-sm text-gray-600">
                    {address.street}, {address.city}, {address.state}
                  </div>
                  {address.landmark && (
                    <div className="text-xs text-gray-500">Near: {address.landmark}</div>
                  )}
                </div>
                {selectedAddress?.id === address.id && (
                  <Check size={20} className="text-blue-600" />
                )}
              </div>
            </button>
          ))}

          {!showAddAddress ? (
            <Button
              onClick={() => setShowAddAddress(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add New Address
            </Button>
          ) : (
            <Card className="p-4 bg-gray-50">
              <div className="space-y-3">
                <Input
                  placeholder="Address label (e.g., Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                />
                <Input
                  placeholder="Street address"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Landmark (optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                />
                <div className="flex space-x-2">
                  <Button onClick={saveAddress} className="flex-1">Save Address</Button>
                  <Button onClick={() => setShowAddAddress(false)} variant="outline">Cancel</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
      )}

      {/* Contact Selection */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Phone size={20} className="mr-2 text-gray-600" />
          Contact Information
        </h3>
        
        {/* Prefilled Contact */}
        {prefilledContact && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">From Premium Settings:</p>
                <p className="font-medium text-gray-900">{prefilledContact.label}</p>
                <p className="text-sm text-gray-600">Phone: {prefilledContact.phone_number}</p>
                <p className="text-sm text-gray-600">WhatsApp: {prefilledContact.whatsapp_number}</p>
              </div>
              <Button
                onClick={() => onContactSelect(prefilledContact)}
                size="sm"
                variant={selectedContact?.id === prefilledContact.id ? "default" : "outline"}
              >
                {selectedContact?.id === prefilledContact.id ? 'Selected' : 'Use This'}
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onContactSelect(contact)}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                selectedContact?.id === contact.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{contact.label}</div>
                  <div className="text-sm text-gray-600">Phone: {contact.phone_number}</div>
                  <div className="text-sm text-gray-600">WhatsApp: {contact.whatsapp_number}</div>
                </div>
                {selectedContact?.id === contact.id && (
                  <Check size={20} className="text-blue-600" />
                )}
              </div>
            </button>
          ))}

          {!showAddContact ? (
            <Button
              onClick={() => setShowAddContact(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add New Contact
            </Button>
          ) : (
            <Card className="p-4 bg-gray-50">
              <div className="space-y-3">
                <Input
                  placeholder="Contact label (e.g., Personal, Work)"
                  value={newContact.label}
                  onChange={(e) => setNewContact(prev => ({ ...prev, label: e.target.value }))}
                />
                <Input
                  placeholder="Phone number"
                  value={newContact.phone_number}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
                />
                <Input
                  placeholder="WhatsApp number"
                  value={newContact.whatsapp_number}
                  onChange={(e) => setNewContact(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                />
                <div className="flex space-x-2">
                  <Button onClick={saveContact} className="flex-1">Save Contact</Button>
                  <Button onClick={() => setShowAddContact(false)} variant="outline">Cancel</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};