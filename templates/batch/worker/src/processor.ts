export interface Job {
  id: string;
  payload: Record<string, unknown>;
}

export interface JobResult {
  jobId: string;
  status: "success" | "failure";
}

export async function processJob(job: Job): Promise<JobResult> {
  console.log(`Processing job ${job.id}`);
  return { jobId: job.id, status: "success" };
}
