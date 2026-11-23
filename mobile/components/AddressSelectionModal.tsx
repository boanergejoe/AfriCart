import palette from "@/lib/theme";
import { useAddresses } from "@/hooks/useAddressess";
import { Address } from "@/types";
import { showMessage } from "@/lib/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (address: Address) => void;
  isProcessing: boolean;
}

const AddressSelectionModal = ({
  visible,
  onClose,
  onProceed,
  isProcessing,
}: AddressSelectionModalProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    isDefault: true,
  });
  const {
    addresses: fetchedAddresses,
    isLoading,
    isError,
    refetch,
    addAddress,
    isAddingAddress,
  } = useAddresses();
  const addresses = fetchedAddresses || [];

  // Preselect the default address without a state-syncing effect.
  const selectedAddress =
    addresses.find((address) => address._id === selectedAddressId) ||
    addresses.find((address) => address.isDefault) ||
    addresses[0] ||
    null;

  const saveAddress = () => {
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
      showMessage("Missing information", "Please fill in all shipping address fields.");
      return;
    }

    const phoneNumber = addressForm.phoneNumber.replace(/[^\d+]/g, "");
    if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
      showMessage("Invalid phone number", "Use 7–15 digits, optionally starting with +.");
      return;
    }

    addAddress(addressForm, {
      onSuccess: (savedAddresses) => {
        const savedAddress = savedAddresses[savedAddresses.length - 1];
        setShowAddressForm(false);
        setSelectedAddressId(savedAddress?._id || null);
        if (savedAddress) onProceed(savedAddress);
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-background rounded-t-3xl h-1/2">
          <View className="flex-row items-center justify-between p-6 border-b border-surface">
            <Text className="text-text-primary text-2xl font-bold">
              {showAddressForm ? "Add Shipping Address" : "Select Address"}
            </Text>
            <TouchableOpacity onPress={onClose} className="bg-surface rounded-full p-2">
              <Ionicons name="close" size={24} color={palette.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {showAddressForm ? (
              <View className="gap-4">
                {[
                  ["Label", "label", "Home"],
                  ["Full Name", "fullName", "Enter your full name"],
                  ["Street Address", "streetAddress", "Street address"],
                  ["City", "city", "City"],
                  ["State", "state", "State"],
                  ["ZIP Code", "zipCode", "ZIP code"],
                  ["Phone Number", "phoneNumber", "+250 7..."],
                ].map(([fieldLabel, fieldName, placeholder]) => (
                  <View key={fieldName}>
                    <Text className="text-text-primary font-semibold mb-2">{fieldLabel}</Text>
                    <TextInput
                      className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                      placeholder={placeholder}
                      placeholderTextColor={palette.text.tertiary}
                      value={addressForm[fieldName as keyof typeof addressForm] as string}
                      onChangeText={(text) =>
                        setAddressForm((current) => ({ ...current, [fieldName]: text }))
                      }
                      keyboardType={fieldName === "phoneNumber" ? "phone-pad" : fieldName === "zipCode" ? "numeric" : "default"}
                    />
                  </View>
                ))}
                <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between">
                  <Text className="text-text-primary font-semibold">Set as default</Text>
                  <Switch
                    value={addressForm.isDefault}
                    onValueChange={(value) =>
                      setAddressForm((current) => ({ ...current, isDefault: value }))
                    }
                  />
                </View>
              </View>
            ) : isLoading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color={palette.accent.info} />
              </View>
            ) : isError ? (
              <View className="py-8 items-center">
                <Text className="text-text-secondary text-center mb-4">
                  We could not load your saved addresses.
                </Text>
                <TouchableOpacity
                  onPress={() => void refetch()}
                  className="bg-primary rounded-2xl px-6 py-3"
                >
                  <Text className="text-background font-bold">Try again</Text>
                </TouchableOpacity>
              </View>
            ) : addresses.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-text-secondary text-center">
                  Add a delivery address to continue to PesaPal payment.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddressForm(true)}
                  className="bg-primary rounded-2xl px-6 py-3 mt-4"
                >
                  <Text className="text-background font-bold">Add Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                {addresses.map((address) => {
                  const isSelected = selectedAddress?._id === address._id;
                  return (
                    <TouchableOpacity
                      key={address._id}
                      className={`bg-surface rounded-3xl p-6 border-2 ${
                        isSelected ? "border-primary" : "border-background-lighter"
                      }`}
                      activeOpacity={0.7}
                      onPress={() => setSelectedAddressId(address._id)}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-3">
                            <Text className="text-primary font-bold text-lg mr-2">
                              {address.label}
                            </Text>
                            {address.isDefault && (
                              <View className="bg-primary/20 rounded-full px-3 py-1">
                                <Text className="text-primary text-sm font-semibold">Default</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-text-primary font-semibold text-lg mb-2">
                            {address.fullName}
                          </Text>
                          <Text className="text-text-secondary text-base leading-6 mb-1">
                            {address.streetAddress}
                          </Text>
                          <Text className="text-text-secondary text-base mb-2">
                            {address.city}, {address.state} {address.zipCode}
                          </Text>
                          <Text className="text-text-secondary text-base">
                            {address.phoneNumber}
                          </Text>
                        </View>
                        {isSelected && (
                          <View className="bg-primary rounded-full p-2 ml-3">
                            <Ionicons name="checkmark" size={24} color={palette.onPrimary} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View className="p-6 border-t border-surface">
            {showAddressForm ? (
              <TouchableOpacity
                className="bg-primary rounded-2xl py-5"
                activeOpacity={0.9}
                onPress={saveAddress}
                disabled={isAddingAddress}
              >
                {isAddingAddress ? (
                  <ActivityIndicator size="small" color={palette.onPrimary} />
                ) : (
                  <Text className="text-background font-bold text-lg text-center">
                    Save Address and Continue
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-primary rounded-2xl py-5"
                activeOpacity={0.9}
                onPress={() => {
                  if (selectedAddress) onProceed(selectedAddress);
                }}
                disabled={!selectedAddress || isProcessing}
              >
                <View className="flex-row items-center justify-center">
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={palette.onPrimary} />
                  ) : (
                    <>
                      <Text className="text-background font-bold text-lg mr-2">
                        Continue to Payment
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color={palette.onPrimary} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddressSelectionModal;
