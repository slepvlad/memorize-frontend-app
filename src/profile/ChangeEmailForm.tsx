import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';

interface Props {
  currentEmail: string;
  onDone: () => void;
}

type Errors = { email?: string; confirm?: string };

export function ChangeEmailForm({ currentEmail, onDone }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { requestEmailChange } = useProfile();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next: Errors = {};
    const email = newEmail.trim();
    const confirm = confirmEmail.trim();
    if (!email) next.email = t('emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = t('emailInvalid');
    else if (email.toLowerCase() === currentEmail.toLowerCase()) next.email = t('sameEmail');
    if (!confirm) next.confirm = t('confirmEmailRequired');
    else if (confirm.toLowerCase() !== email.toLowerCase()) next.confirm = t('emailMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (saving || !validate()) return;
    const email = newEmail.trim();
    setSaving(true);
    try {
      await requestEmailChange(email);
      showToast(t('emailChangeRequested', { email }), 'success');
      onDone();
    } catch {
      // error surfaced globally by axios interceptor (toast)
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Input
        label={t('newEmailLabel')}
        placeholder={t('emailPlaceholder')}
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
        testID="new-email-input"
      />
      <Input
        label={t('confirmNewEmailLabel')}
        placeholder={t('reEnterEmail')}
        value={confirmEmail}
        onChangeText={setConfirmEmail}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.confirm}
        testID="confirm-email-input"
      />
      <Button title={t('save')} onPress={handleSubmit} loading={saving} />
    </View>
  );
}
