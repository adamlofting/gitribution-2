CREATE TABLE `activities` (
  `happened_on` datetime NOT NULL,
  `github_organization` varchar(255) DEFAULT NULL,
  `github_repository` varchar(255) DEFAULT NULL,
  `github_username` varchar(255) DEFAULT NULL,
  `github_public_email` varchar(255) DEFAULT NULL,
  `github_commit_url` varchar(1000) DEFAULT NULL,
  `action_type` varchar(255) DEFAULT NULL,
  `commit_id` varchar(45) DEFAULT NULL,
  `commit_msg` text,
  UNIQUE KEY `happened_on` (`happened_on`,`github_organization`,`github_repository`,`action_type`),
  KEY `activities_org_repo_index` (`github_organization`,`github_repository`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



CREATE TABLE `summary` (
  `team` varchar(45) NOT NULL,
  `type` varchar(45) NOT NULL,
  `wkcommencing` date NOT NULL,
  `totalactive` int(11) NOT NULL,
  `new` int(11) NOT NULL,
  UNIQUE KEY `unique_key` (`team`,`type`,`wkcommencing`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
