import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { usersApi } from '../api/users';
import { useToast } from '../context/ToastContext';

interface Props {
  onDone: () => void;
}

type Errors = { current?: string; next?: string; confirm?: string };

export function ChangePasswordForm({ onDone }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (!currentPassword) next.current = t('passwordRequired');
    if (!newPassword) next.next = t('passwordRequired');
    else if (newPassword.length < 6) next.next = t('passwordMin6');
    else if (newPassword === currentPassword) next.next = t('samePassword');
    if (!confirmPassword) next.confirm = t('confirmRequired');
    else if (confirmPassword !== newPassword) next.confirm = t('passwordMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      showToast(t('passwordChanged'), 'success');
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
        label={t('currentPasswordLabel')}
        placeholder={t('passwordPlaceholder')}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        isPassword
        autoComplete="current-password"
        error={errors.current}
        testID="current-password-input"
      />
      <Input
        label={t('newPasswordLabel')}
        placeholder={t('passwordMinLength')}
        value={newPassword}
        onChangeText={setNewPassword}
        isPassword
        autoComplete="new-password"
        error={errors.next}
        testID="new-password-input"
      />
      <Input
        label={t('confirmNewPasswordLabel')}
        placeholder={t('reEnterPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        autoComplete="new-password"
        error={errors.confirm}
        testID="confirm-password-input"
      />
      <Button title={t('save')} onPress={handleSubmit} loading={saving} />
    </View>
  );
}
