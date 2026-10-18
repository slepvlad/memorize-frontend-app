import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { usersApi } from '../api/users';
import { useToast } from '../context/ToastContext';

interface Props {
  currentEmail: string;
  onDone: () => void;
}

export function ChangeEmailForm({ currentEmail, onDone }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    const email = newEmail.trim();
    if (!email) next.email = t('emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = t('emailInvalid');
    else if (email.toLowerCase() === currentEmail.toLowerCase()) next.email = t('sameEmail');
    if (!password) next.password = t('passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    try {
      await usersApi.changeEmail({ newEmail: newEmail.trim(), currentPassword: password });
      showToast(t('emailChangeRequested'), 'success');
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
        label={t('currentPasswordLabel')}
        placeholder={t('passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        isPassword
        error={errors.password}
        testID="email-current-password-input"
      />
      <Button title={t('save')} onPress={handleSubmit} loading={saving} />
    </View>
  );
}
