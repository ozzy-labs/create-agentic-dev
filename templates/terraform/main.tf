# {{projectName}} infrastructure

terraform {
  required_version = ">= 1.0"

  # TODO: Configure remote backend for state management
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "{{projectName}}/terraform.tfstate"
  #   region = "ap-northeast-1"
  # }

  # TODO: Add required providers
  # required_providers {
  #   aws = {
  #     source  = "hashicorp/aws"
  #     version = "~> 5.0"
  #   }
  # }
}

# TODO: Configure provider
# provider "aws" {
#   region = var.region
# }
