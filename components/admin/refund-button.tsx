"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { refundOrder, type RefundState } from "@/app/admin/actions";

const initialState: RefundState = null;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center rounded border-2 border-fg px-4 text-base font-medium transition-colors hover:bg-fg hover:text-bg disabled:opacity-50"
    >
      {pending ? "처리 중…" : "환불"}
    </button>
  );
}

/**
 * 환불 버튼.
 *
 * 되돌릴 수 없는 작업이므로 누르기 전에 한 번 확인한다.
 * 확인 없이 한 번의 클릭으로 남의 수강권이 사라지면 안 된다.
 */
export function RefundButton({ orderCode }: { orderCode: string }) {
  const [state, formAction] = useActionState(refundOrder, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm(`${orderCode} 주문을 환불 처리할까요?\n수강권도 함께 회수됩니다.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderCode" value={orderCode} />
      <Submit />
      {state ? (
        <p role="alert" className="mt-2 max-w-xs text-sm leading-relaxed">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
