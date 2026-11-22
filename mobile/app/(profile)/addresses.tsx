import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import AddressCard from "@/components/AddressCard";
import AddressesHeader from "@/components/AddressesHeader";
import AddressFormModal from "@/components/AddressFormModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import { confirmAction, showMessage } from "@/lib/alerts";
import palette from "@/lib/theme";
import { getErrorMessage } from "@/lib/utils";
import { Address } from "@/types";
import { useState } from "react";

const EMPTY_FORM = {
  label: "",
  fullName: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  phoneNumber: "",
  isDefault: false,
};

function AddressesScreen() {
  const {
    addAddress,
    addresses,
    deleteAddress,
    isAddingAddress,
    isError,
    isLoading,
    isUpdatingAddress,
    isAddressPending,
    refetch,
    updateAddress,
  } = useAddresses();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(EMPTY_FORM);

  const handleAddAddress = () => {
    setAddressForm(EMPTY_FORM);
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phoneNumber: address.phoneNumber,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string, label: string) => {
    const confirmed = await confirmAction("Delete address", `Delete ${label}?`, {
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    deleteAddress(addressId, {
      onError: (error: unknown) => showMessage("Could not delete address", getErrorMessage(error)),
    });
  };

  const handleSaveAddress = () => {
    const requiredFields = [
      addressForm.label,
      addressForm.fullName,
      addressForm.streetAddress,
      addressForm.city,
      addressForm.state,
      addressForm.zipCode,
      addressForm.phoneNumber,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      showMessage("Missing information", "Please fill in all fields.");
      return;
    }

    const phoneNumber = addressForm.phoneNumber.replace(/[^\d+]/g, "");
    if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
      showMessage("Invalid phone number", "Use 7–15 digits, optionally starting with +.");
      return;
    }

    if (editingAddressId) {
      updateAddress(
        { addressId: editingAddressId, addressData: addressForm },
        {
          onSuccess: () => {
            setShowAddressForm(false);
            setEditingAddressId(null);
            showMessage("Saved", "Address updated successfully.");
          },
          onError: (error: unknown) =>
            showMessage("Could not update address", getErrorMessage(error)),
        }
      );
      return;
    }

    addAddress(addressForm, {
      onSuccess: () => {
        setShowAddressForm(false);
        showMessage("Saved", "Address added successfully.");
      },
      onError: (error: unknown) => showMessage("Could not add address", getErrorMessage(error)),
    });
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <AddressesHeader />
        <LoadingState message="Loading addresses…" />
      </SafeScreen>
    );
  }

  if (isError) {
    return (
      <SafeScreen>
        <AddressesHeader />
        <ErrorState
          title="Failed to load addresses"
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <AddressesHeader />

      {addresses.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No addresses yet"
          description="Add a delivery address to speed up checkout."
          actionLabel="Add Address"
          onAction={handleAddAddress}
        />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}
        >
          <View className="px-6 py-4" style={{ width: "100%", maxWidth: palette.layout.compactContent }}>
            {addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                isPending={isAddressPending(address._id)}
              />
            ))}

            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center mt-2"
              activeOpacity={0.8}
              onPress={handleAddAddress}
              accessibilityRole="button"
              accessibilityLabel="Add a new address"
            >
              <View className="flex-row items-center">
                <Text className="text-background font-bold text-base">+ Add New Address</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <AddressFormModal
        visible={showAddressForm}
        isEditing={!!editingAddressId}
        addressForm={addressForm}
        isAddingAddress={isAddingAddress}
        isUpdatingAddress={isUpdatingAddress}
        onClose={handleCloseAddressForm}
        onSave={handleSaveAddress}
        onFormChange={setAddressForm}
      />
    </SafeScreen>
  );
}

export default AddressesScreen;
