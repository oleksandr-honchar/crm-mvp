// apps/web/src/components/DeleteButton.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  invalidateKey: string;
  label?: string;
}

export function DeleteButton({ onDelete, invalidateKey, label = 'Delete' }: DeleteButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
    },
  });

  function handleClick() {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      mutation.mutate();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {mutation.isPending ? 'Deleting...' : label}
    </button>
  );
}