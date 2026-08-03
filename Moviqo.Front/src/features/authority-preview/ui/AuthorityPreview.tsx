import {
  deniedAccessFixture,
  rejectedCompletionFixture
} from "../../../entities/server-decisions";
import { Button } from "../../../shared/ui/Button";
import { formatAccessDecision, formatCompletionAttempt } from "../model/nonAuthoritativeUi";

export function AuthorityPreview() {
  return (
    <section className="status-panel" aria-labelledby="status-title">
      <h2 id="status-title">Server response required</h2>
      <p>{formatAccessDecision(deniedAccessFixture)}</p>
      <p>{formatCompletionAttempt(rejectedCompletionFixture)}</p>
      <Button type="button">Review assigned work</Button>
    </section>
  );
}
