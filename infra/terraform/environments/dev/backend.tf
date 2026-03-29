terraform {
  backend "gcs" {
    bucket = "broodly-terraform-state"
    prefix = "dev"
  }
}
