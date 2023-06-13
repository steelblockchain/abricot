export type AStar4Direction = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

export type AStarPosition = {
    x: number;
    y: number;
    walkable: boolean;
};

export type AStarPositionString = `(${number},${number})`;

export type AStarNeighbors = {
    top?: AStarNode;
    right?: AStarNode;
    bottom?: AStarNode;
    left?: AStarNode;
};

export type AStarGrid = Record<AStarPositionString, AStarNode>;

export type AStarGridSize = {
    width: number;
    height: number;
};

export class AStarNode {
    public readonly position: AStarPosition;

    public g: number;
    public h: number;
    public f: number;
    public parent?: AStarNode;

    constructor(position: AStarPosition) {
        this.position = position;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

export class AStar {
    public readonly grid: AStarGrid;
    public readonly grid_size: AStarGridSize;

    constructor(grid: Array<AStarNode>, grid_size: AStarGridSize) {
        this.grid = grid.reduce(
            (acc: Record<AStarPositionString, AStarNode>, curr: AStarNode) => {
                return {
                    ...acc,
                    [`(${curr.position.x},${curr.position.y})`]: curr,
                };
            },
            {}
        );
        this.grid_size = grid_size;
    }

    get_direction(from: AStarPosition, to: AStarPosition): AStar4Direction {
        const neighbors = this.get_neighbors(from);

        if (
            neighbors.top?.position.x === to.x &&
            neighbors.top?.position.y === to.y
        ) {
            return "TOP";
        }
        if (
            neighbors.right?.position.x === to.x &&
            neighbors.right?.position.y === to.y
        ) {
            return "RIGHT";
        }
        if (
            neighbors.bottom?.position.x === to.x &&
            neighbors.bottom?.position.y === to.y
        ) {
            return "BOTTOM";
        }
        if (
            neighbors.left?.position.x === to.x &&
            neighbors.left?.position.y === to.y
        ) {
            return "LEFT";
        }
        throw new Error("direction only on neighbors");
    }

    calculate_heuristic(from: AStarPosition, to: AStarPosition): number {
        // Calculate the Manhattan distance as the heuristic
        const dx = Math.abs(from.x - to.x);
        const dy = Math.abs(from.y - to.y);
        return dx + dy;
    }

    get_neighbors(position: AStarPosition): AStarNeighbors {
        const pair_line = position.y % 2 === 0;
        if (!pair_line) {
            return {
                top: this.grid[`(${position.x + 1},${position.y - 1})`],
                right: this.grid[`(${position.x + 1},${position.y + 1})`],
                bottom: this.grid[`(${position.x},${position.y + 1})`],
                left: this.grid[`(${position.x},${position.y - 1})`],
            };
        } else {
            return {
                top: this.grid[`(${position.x},${position.y - 1})`],
                right: this.grid[`(${position.x},${position.y + 1})`],
                bottom: this.grid[`(${position.x - 1},${position.y + 1})`],
                left: this.grid[`(${position.x - 1},${position.y - 1})`],
            };
        }
    }

    find_path(from: AStarPosition, to: AStarPosition): Array<AStarNode> {
        const from_node: AStarNode = this.grid[`(${from.x},${from.y})`];
        const to_node: AStarNode = this.grid[`(${to.x},${to.y})`];

        if (
            !from_node ||
            !to_node ||
            !from_node.position.walkable ||
            !to_node.position.walkable
        ) {
            return [];
        }

        const open_list: Array<AStarNode> = [];
        const closed_list: Array<AStarPositionString> = [];

        open_list.push(from_node);

        while (open_list.length > 0) {
            // Find the AStarNode with the lowest total cost (f value)
            let current_node = open_list[0];
            let current_index = 0;
            for (let i = 0; i < open_list.length; i++) {
                if (open_list[i].f < current_node.f) {
                    current_node = open_list[i];
                    current_index = i;
                }
            }

            // Move the current AStarNode from the open list to the closed list
            open_list.splice(current_index, 1);
            closed_list.push(
                `(${current_node.position.x},${current_node.position.y})`
            );

            if (
                current_node.position.x === to_node.position.x &&
                current_node.position.y === to_node.position.y
            ) {
                const path: Array<AStarNode> = [];
                let current: AStarNode | undefined = current_node;
                while (current !== undefined) {
                    path.push(current);
                    current = current.parent;
                }
                return path.reverse();
            }

            const neighbors = this.get_neighbors(current_node.position);

            for (const neighbor of Object.values(neighbors).filter(Boolean)) {
                if (
                    closed_list.includes(
                        `(${neighbor.position.x},${neighbor.position.y})`
                    ) ||
                    !neighbor.position.walkable
                ) {
                    continue;
                }
                const g_score = current_node.g + 1;
                const in_open_list = open_list.find(
                    (e) =>
                        e.position.x === neighbor.position.x &&
                        e.position.y === neighbor.position.y
                );

                if (in_open_list) {
                    if (g_score < neighbor.g) {
                        neighbor.g = g_score;
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = current_node;
                    }
                } else {
                    neighbor.g = g_score;
                    neighbor.h = this.calculate_heuristic(
                        neighbor.position,
                        to_node.position
                    );
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current_node;
                    open_list.push(neighbor);
                }
            }
        }

        return [];
    }
}
