-- Passage en lot (asynchrone) du statut des commandes : un lot par opération, une ligne par commande.
-- Traité côté serveur (worker) ; l'interface ne fait qu'interroger l'avancement.
-- Statuts de lot : queued | running | done ; statuts de ligne : pending | success | failed | skipped.

CREATE TABLE public.order_batch_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  target_status TEXT NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notify BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done')),
  total INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  heartbeat_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.order_batch_job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.order_batch_jobs(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  position INTEGER NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  error TEXT,
  invoice_number TEXT,
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX order_batch_job_items_job_status_idx ON public.order_batch_job_items(job_id, status, position);
CREATE INDEX order_batch_jobs_status_idx ON public.order_batch_jobs(status);

ALTER TABLE public.order_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_batch_job_items ENABLE ROW LEVEL SECURITY;

-- Lecture réservée aux admins ; toutes les écritures passent par le service role (serveur).
CREATE POLICY "Admins can view batch jobs"
  ON public.order_batch_jobs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view batch job items"
  ON public.order_batch_job_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
