CREATE TABLE `activities` (
  `happened_on` datetime NOT NULL,
  `github_organization` varchar(255) DEFAULT NULL,
  `github_repository` varchar(255) DEFAULT NULL,
  `github_username` varchar(255) DEFAULT NULL,
  `github_public_email` varchar(255) DEFAULT NULL,
  `action_type` varchar(255) DEFAULT NULL,
  UNIQUE KEY `happened_on` (`happened_on`,`github_organization`,`github_repository`,`action_type`),
  KEY `activities_org_repo_index` (`github_organization`,`github_repository`),
  KEY `activities_org_repo_date_idx` (`happened_on`,`github_organization`,`github_repository`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
