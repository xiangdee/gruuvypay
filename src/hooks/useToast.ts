import { useAppDispatch } from "@/store/hooks";
import { ToastType, showToast, hideToast } from "@/store/slices/ui.slice";


export function useToast() {
  const dispatch = useAppDispatch();

  const toast = (type: ToastType, title: string, message?: string, duration?: number) => {
    dispatch(showToast({ type, title, message, duration }));
  };

  return {
    success: (title: string, message?: string) => toast('success', title, message),
    error:   (title: string, message?: string) => toast('error', title, message),
    warning: (title: string, message?: string) => toast('warning', title, message),
    info:    (title: string, message?: string) => toast('info', title, message),
    dismiss: () => dispatch(hideToast()),
  };
}